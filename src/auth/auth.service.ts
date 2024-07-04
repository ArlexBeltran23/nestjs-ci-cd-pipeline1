import { LoginDto } from './dto/login.dto';
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UpdateAuthDto, CreateUserDto, RegisterDto } from './dto/index';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payloas';
import { LoginResponse } from './interfaces/login-response';
import { CheckToken } from './dto/check-token.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) 
    private userModel: Model<User>,

    private jwtService: JwtService
    ) {}


 async create(createUserDto: CreateUserDto): Promise<User> {
    
    try {

      const {password, ...userData} = createUserDto;
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      await newUser.save();
      const {password:_, ...user} = newUser.toJSON()

      return user;
      
      //encriptar la contraseña
      
      //guardar el usuario
      
      
      
    } catch (error) {
      if(error.code === 11000){
        throw new BadRequestException(`${createUserDto.email} alreaady exist`)
      }
      throw new InternalServerErrorException('Somethin terrible happen!!!')
    }


    
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse>{
   
   
    const user = await this.create(registerDto);
    console.log({user});

    return{
      user: user,
      token: this.getJwtToken({id: user._id})
    }


  }

  async login(loginDto: LoginDto): Promise<LoginResponse>{
    
    const {email, password}= loginDto;

    const user = await this.userModel.findOne({email});
    if(!user){
      throw new UnauthorizedException('Not valid credential - email')
    }

    if(!bcryptjs.compareSync(password, user.password)){
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const {password:_, ...rest} = user.toJSON()

      return {
       user: rest,
        token: this.getJwtToken({id: user.id}),
      }
  }


  chechToken(chechToken: CheckToken){
    
  }

  findAll(): Promise<User[]> {
    return this.userModel.find()
  }

  async findUserById(id: string){
    const user = await this.userModel.findById(id);
    const {password, ...rest} = user.toJSON();
    return rest
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken(payload: JwtPayload){

    const token = this.jwtService.sign(payload);
    return token;

  }
}
